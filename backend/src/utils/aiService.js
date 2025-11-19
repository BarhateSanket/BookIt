const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function for natural language search
async function parseSearchQuery(query) {
  const prompt = `Parse the following search query for experiences booking and extract key parameters like location, activity type, date, price range, etc. Query: "${query}"`;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 150,
  });

  return response.choices[0].message.content;
}

// Function for chatbot response
async function getChatbotResponse(message, context = '') {
  const prompt = `You are a helpful assistant for BookIt, an experiences booking platform. Respond to the user's message: "${message}". Context: ${context}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 200,
  });

  return response.choices[0].message.content;
}

// Function for predictive analytics (e.g., booking likelihood)
async function predictBookingLikelihood(userData, experienceData) {
  const prompt = `Based on user data: ${JSON.stringify(userData)} and experience data: ${JSON.stringify(experienceData)}, predict the likelihood of booking on a scale of 1-10.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 50,
  });

  return response.choices[0].message.content;
}

// Function for automated support
async function generateSupportResponse(ticket) {
  const prompt = `Generate a helpful response to this support ticket: "${ticket}"`;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 200,
  });

  return response.choices[0].message.content;
}

module.exports = {
  parseSearchQuery,
  getChatbotResponse,
  predictBookingLikelihood,
  generateSupportResponse,
};