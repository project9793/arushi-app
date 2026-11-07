import type { FunctionDeclaration } from '@google/genai';

export const TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'openWhatsApp',
    description:
      'Open WhatsApp on the user device. Use for any request to open WhatsApp, including "WhatsApp kholo", "WhatsApp open karo", "WhatsApp chalao", "open my WhatsApp", "WhatsApp khol do".',
    parametersJsonSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'openApp',
    description:
      'Open one of the allowlisted installed apps. Supported app names: WhatsApp, YouTube, Instagram, Facebook, Telegram, Gmail, Google Maps, Spotify, X (Twitter), Chrome, Phone, Camera, Settings. Use for "open YouTube", "YouTube kholo", "Instagram chala do".',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        appName: {
          type: 'string',
          description: 'Name of the app the user wants to open, exactly as they said it.',
        },
      },
      required: ['appName'],
    },
  },
  {
    name: 'openUrl',
    description:
      'Open a website in the browser. Use when the user asks to open a site or search something on the web. Provide a full https URL when the user gave a site; if they only gave a search phrase, build a Google search URL.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Absolute http(s) URL to open, for example https://youtube.com.',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'makeCall',
    description:
      'Start a phone call or open the dialer for a specific phone number. Use for "call 9876543210", "phone 9876543210", "is number pe call karo". Never guess a number.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        phoneNumber: {
          type: 'string',
          description: 'The phone number to call, with country code if the user gave one.',
        },
      },
      required: ['phoneNumber'],
    },
  },
  {
    name: 'callContact',
    description:
      'Call a person by name using the phone contacts, for example "Call Mom", "Mummy ko phone lagao", "Rahul ko call karo". The app searches contacts; if several people match it asks the user which one instead of guessing.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        contactName: {
          type: 'string',
          description: 'Name of the person to call, as the user said it.',
        },
      },
      required: ['contactName'],
    },
  },
];
