import type { FunctionDeclaration } from '@google/genai';

export const TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'openWhatsApp',
    description:
      'Open WhatsApp on the user device. Use for "WhatsApp kholo", "WhatsApp open karo", "open my WhatsApp".',
    parametersJsonSchema: { type: 'object', properties: {} },
  },
  {
    name: 'sendWhatsAppMessage',
    description:
      'Open WhatsApp with a chat to a specific number and a message already typed in. Use for "Rahul ko WhatsApp par message bhejo ki main late hoon". The user still presses send.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        phoneNumber: { type: 'string', description: 'Phone number with country code if the user gave one.' },
        message: { type: 'string', description: 'The message text to pre-fill.' },
      },
      required: ['phoneNumber', 'message'],
    },
  },
  {
    name: 'openApp',
    description:
      'Open one of the allowlisted installed apps. Supported: WhatsApp, YouTube, Telegram, X, LinkedIn, Google Maps, Spotify, Netflix, Amazon, Flipkart, Chrome, Phone, Camera, Settings. Any other app is not supported.',
    parametersJsonSchema: {
      type: 'object',
      properties: { appName: { type: 'string', description: 'Name of the app as the user said it.' } },
      required: ['appName'],
    },
  },
  {
    name: 'openUrl',
    description: 'Open a website in the browser. Provide a full http(s) URL.',
    parametersJsonSchema: {
      type: 'object',
      properties: { url: { type: 'string', description: 'Absolute http(s) URL.' } },
      required: ['url'],
    },
  },
  {
    name: 'searchWeb',
    description:
      'Search the web in the user browser. Use when the user asks to look something up, or asks a question that needs a current answer they want to read.',
    parametersJsonSchema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'What to search for.' } },
      required: ['query'],
    },
  },
  {
    name: 'makeCall',
    description:
      'Start a phone call or open the dialer for a specific number. Use for "call 9876543210", "is number pe call karo". Never guess a number.',
    parametersJsonSchema: {
      type: 'object',
      properties: { phoneNumber: { type: 'string', description: 'Number to call, with country code if given.' } },
      required: ['phoneNumber'],
    },
  },
  {
    name: 'callContact',
    description:
      'Call a person by name using the phone contacts, for example "Call Mom", "Mummy ko phone lagao", "Rahul ko call karo". If several contacts match, the app asks instead of guessing.',
    parametersJsonSchema: {
      type: 'object',
      properties: { contactName: { type: 'string', description: 'Name of the person to call.' } },
      required: ['contactName'],
    },
  },
];
