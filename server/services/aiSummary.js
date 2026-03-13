const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic();

/**
 * Analyze a transcript and extract per-speaker summaries.
 * Expects speakers from the session's history records.
 */
async function analyzeTranscript(transcriptText, speakers) {
  const speakerList = speakers.map((s) => `- ${s.speaker} (topic: "${s.topic}")`).join('\n');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Sei un assistente che analizza le trascrizioni delle sessioni "Thank God It's Innovation" di AvantGrade.com. Ogni sessione ha 3 speaker da 10 minuti ciascuno.

Ecco gli speaker di questa sessione:
${speakerList}

Ecco la trascrizione della sessione:
---
${transcriptText}
---

Per ogni speaker, scrivi un riassunto conciso (3-5 frasi) in italiano di cosa ha presentato, i punti chiave e eventuali takeaway per il team.

Rispondi SOLO in formato JSON valido, senza markdown, come questo:
[
  {"speaker": "Nome", "summary": "Riassunto qui..."},
  {"speaker": "Nome2", "summary": "Riassunto qui..."}
]`
      }
    ],
  });

  const text = response.content[0].text.trim();
  const summaries = JSON.parse(text);
  return summaries;
}

module.exports = { analyzeTranscript };
