import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { base64, mediaType } = req.body;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
            { type: 'text', text: `Tu es un assistant d'agréage au marché de Rungis. Analyse cette étiquette de colis et extrait uniquement ces informations en JSON strict (pas de markdown, pas d'explication) :
{"produit":"nom du produit","origine":"pays d'origine","fournisseur":"nom du fournisseur ou producteur","lotFournisseur":"numéro de lot fournisseur chiffres seulement","poids":"poids en kg chiffres seulement sans unité"}
Si une info est absente mets "". Ne mets que ce que tu vois clairement.` }
          ]
        }]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json({ error: JSON.stringify(data) });
    }
    
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
