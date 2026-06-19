const { OpenAI } = require('openai');

// Initialize OpenAI client if API key is present
const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('Warning: OPENAI_API_KEY environment variable is not set. AI operations will run in Simulation Mode.');
    return null;
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

/**
 * Strips HTML tags from content to compile clean plain text for AI prompts.
 */
const stripHtml = (html) => {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * @desc    Suggest the next paragraph based on current story content
 * @route   POST /api/ai/suggest
 * @access  Private
 */
const suggestNextParagraph = async (req, res) => {
  try {
    const { content } = req.body;
    const cleanContent = stripHtml(content);

    if (!cleanContent) {
      return res.status(400).json({ message: 'Story content is required for suggestion' });
    }

    const openai = getOpenAIClient();
    if (!openai) {
      // Simulation Mode fallback
      const simulatedResponses = [
        "A cold wind swept through the canyon, carrying the faint scent of sulfur and old leather. They exchanged a brief, uneasy look, knowing that whatever was tracking them from the shadows was no longer keeping its distance. Silently, she reached down to loosen the sword in its scabbard, bracing for the inevitable strike.",
        "Without warning, the stone door groaned, sliding back into the bedrock to reveal a narrow passageway illuminated by blue crystal sconces. The air that rushed out was stale, smelling of centuries-old dust and stagnant water. It was a clear invitation—or a trap—but staying behind meant certain death.",
        "Suddenly, the tavern grew silent as a tall figure clad in a rain-soaked cloak stepped through the entrance. The barkeep stopped cleaning his glass, and the dice players froze mid-throw. Beneath the hood, a single scar caught the firelight, confirming the rumor: the Hunter of Aethelgard had returned."
      ];
      const randomSuggest = simulatedResponses[Math.floor(Math.random() * simulatedResponses.length)];
      return res.json({ suggestion: randomSuggest, simulated: true });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional co-writer and creative novelist. Continue the user\'s story with exactly one creative, descriptive paragraph. Match the writing style, tone, vocabulary, and narrative flow of the provided text. Return ONLY the next paragraph, with no introduction, meta-commentary, or markdown tags.'
        },
        {
          role: 'user',
          content: `Here is the current story content:\n"""\n${cleanContent.slice(-4000)}\n"""\n\nGenerate the next paragraph.`
        }
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const suggestion = response.choices[0].message.content.trim();
    res.json({ suggestion });
  } catch (error) {
    console.error('AI Suggestion Error:', error.message);
    res.status(500).json({ message: 'Failed to generate AI story suggestion: ' + error.message });
  }
};

/**
 * @desc    Generate a plot twist based on current story content
 * @route   POST /api/ai/plot-twist
 * @access  Private
 */
const generatePlotTwist = async (req, res) => {
  try {
    const { content } = req.body;
    const cleanContent = stripHtml(content);

    if (!cleanContent) {
      return res.status(400).json({ message: 'Story content is required to generate a plot twist' });
    }

    const openai = getOpenAIClient();
    if (!openai) {
      // Simulation Mode fallback
      const simulatedTwists = [
        "It is revealed that one of the trusted main characters has secretly been an agent of the antagonist all along, feeding them information since they first left the capital.",
        "The mysterious artifact they are searching for is not a weapon of defense, but a beacon that will alert a sleeping titan buried deep beneath their hometown.",
        "The antagonist they are trying to overthrow is actually a future version of the protagonist, who traveled back in time to prevent an even greater apocalypse from occurring."
      ];
      const randomTwist = simulatedTwists[Math.floor(Math.random() * simulatedTwists.length)];
      return res.json({ twist: randomTwist, simulated: true });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional story editor and plot consultant. Read the story outline/details and suggest one highly creative, unexpected, and engaging plot twist that would hook readers and take the narrative in an exciting direction. Return ONLY the suggested plot twist description, without any conversational introduction or meta-text.'
        },
        {
          role: 'user',
          content: `Here is the current story content:\n"""\n${cleanContent.slice(-4000)}\n"""\n\nSuggest a creative plot twist.`
        }
      ],
      temperature: 0.8,
      max_tokens: 250,
    });

    const twist = response.choices[0].message.content.trim();
    res.json({ twist });
  } catch (error) {
    console.error('AI Plot Twist Error:', error.message);
    res.status(500).json({ message: 'Failed to generate AI plot twist: ' + error.message });
  }
};

/**
 * @desc    Improve writing (grammar, clarity, readability, style)
 * @route   POST /api/ai/improve
 * @access  Private
 */
const improveWriting = async (req, res) => {
  try {
    const { text } = req.body;
    const cleanText = stripHtml(text);

    const openai = getOpenAIClient();
    if (!openai) {
      // Simulation Mode fallback
      if (!cleanText) {
        return res.status(400).json({ message: 'Text to improve is required' });
      }
      const simulatedImproved = `With a polished style: "${cleanText}" - This draft is clear and maintains a strong narrative flow, enhanced with descriptive adjectives and corrected grammatical structure.`;
      return res.json({ improvedText: simulatedImproved, simulated: true });
    }

    if (!cleanText) {
      return res.status(400).json({ message: 'Text to improve is required' });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional editor. Polish the provided text to improve grammar, clarity, vocabulary, sentence flow, and overall readability. Preserve the original meaning, style, and voice of the author. Return ONLY the improved text, with no other explanations, headings, quotes, or meta-comments.'
        },
        {
          role: 'user',
          content: `Polish and improve the following text:\n"""\n${cleanText}\n"""`
        }
      ],
      temperature: 0.5,
      max_tokens: 500,
    });

    const improvedText = response.choices[0].message.content.trim();
    res.json({ improvedText });
  } catch (error) {
    console.error('AI Improve Writing Error:', error.message);
    res.status(500).json({ message: 'Failed to improve writing: ' + error.message });
  }
};

module.exports = {
  suggestNextParagraph,
  generatePlotTwist,
  improveWriting,
};
