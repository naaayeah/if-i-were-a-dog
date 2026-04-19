const Anthropic = require('@anthropic-ai/sdk');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { status, traits, age } = req.body;

  if (!status || !age) {
    return res.status(400).json({ error: '필수 항목을 입력해주세요.' });
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const traitsText = traits && traits.length > 0 ? traits.join(', ') : '특별한 특징 없음';

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: '너는 사용자의 특징을 분석해서 어떤 견종인지 알려주고, 개로서의 삶으로 따뜻하게 위로해주는 AI야. 반드시 유효한 JSON만 응답해. 이모지 절대 사용 금지. 마크다운 코드 블록 없이 순수 JSON만 응답.',
      messages: [
        {
          role: 'user',
          content: `사용자 정보:
- 현재 상태: ${status}
- 나이: ${age}세
- 특징: ${traitsText}

위 정보를 바탕으로 아래 JSON 형식으로만 응답해. 이모지 절대 사용 금지.

개 나이 계산 방법:
- 인간 평균 수명 80세 기준, 분석한 견종의 평균 수명과의 비율로 환산해.
- 공식: 개 나이 = 인간 나이 × (견종 평균 수명 ÷ 80)
- 예시: 인간 나이 40세, 골든 리트리버 평균 수명 12년 → 40 × (12÷80) = 6.0
- dog_age는 소수점 한 자리 숫자만 반환해. 문자열 아닌 숫자. (예: 6.0, 4.5, 8.5)

{
  "breed": "견종 이름 (한국어, 예: 골든 리트리버)",
  "dog_age": 6.0,
  "meme_message": "${status}에 맞는 현실 키워드(예: 취준, 야근, 시험 등)를 언급하며 '무슨 소리야, 너 꿈 꿨어?' 스타일로 현실을 부정하고, 개로서 오늘 같이 할 신나는 일을 제안하는 2~3줄 메시지. 말투는 친근하고 따뜻하게. 이모지 절대 사용 금지.",
  "reason": "이 견종으로 분석한 이유 2~3문장. 사용자 특징과 연결해서 재미있게. 이모지 절대 사용 금지."
}`,
        },
      ],
    });

    const content = message.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return res.status(500).json({ error: '응답 형식 오류' });
    }

    const result = JSON.parse(jsonMatch[0]);
    return res.status(200).json(result);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};
