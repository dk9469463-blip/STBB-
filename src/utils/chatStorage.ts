export type AssistantLanguage = 'english' | 'urdu' | 'sindhi';

export interface BookContext {
  classNumber?: number;
  subjectName?: string;
  bookTitle?: string;
  chapter?: string;
  exercise?: string;
  pageNumber?: number;
  questionNumber?: string;
  selectedText?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  language: AssistantLanguage;
  bookContext?: BookContext;
  imageBase64?: string;
  followUps?: string[];
  isError?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  language: AssistantLanguage;
  bookContext?: BookContext;
  messages: ChatMessage[];
}

const STORAGE_KEY_CONVERSATIONS = 'stbb_ai_chat_conversations_v2';
const STORAGE_KEY_ACTIVE_ID = 'stbb_ai_active_conv_id_v2';

export function getGreetingForLanguage(language: AssistantLanguage): string {
  switch (language) {
    case 'urdu':
      return 'سندھ ٹیکسٹ بک بورڈ (STBB) کے اے آئی اسٹڈی اسسٹنٹ میں خوش آمدید! آپ کلاس 1 سے 12 کے تمام مضامین، مشقوں، فارمولوں اور اسباق کے بارے میں سوال پوچھ سکتے ہیں۔';
    case 'sindhi':
      return 'سنڌ ٽيڪسٽ بوڪ بورڊ (STBB) جي AI اسٽڊي اسسٽنٽ ۾ ڀليڪار! توهان ڪلاس 1 کان 12 تائين سمورن درسي ڪتابن، مشقن ۽ سوالن جا جواب حاصل ڪري سگهو ٿا.';
    default:
      return 'Welcome to the STBB AI Study Assistant. You can ask questions, solve textbook exercises, and get clear step-by-step guidance for Classes 1 to 12 across all STBB subjects.';
  }
}

export function getDefaultFollowUps(language: AssistantLanguage): string[] {
  switch (language) {
    case 'urdu':
      return [
        'کلاس 9 حیاتیات (Biology) کے مشقی سوالات حل کریں',
        'کلاس 11 ریاضی (Mathematics) سیٹ اور فنکشنز',
        'مشکل الفاظ کے معنی اور جملے بتائیں',
      ];
    case 'sindhi':
      return [
        'ڪلاس 9 بائلاجي (Biology) جي مشق حل ڪريو',
        'ڪلاس 10 فزڪس جا نيوميريڪل سمجهايو',
        'هن لفظ جي سنڌي معنيٰ ۽ جملو ٻڌايو',
      ];
    default:
      return [
        'Class 11 Mathematics: Exercise 9.1 Sets and Functions',
        'Class 9 Biology: Cell structure and exercise questions',
        'Class 10 Physics: Motion and Newton laws numericals',
      ];
  }
}

export function getStoredConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONVERSATIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveConversations(conversations: Conversation[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(conversations));
  } catch (err) {
    console.warn('Failed to save conversations to localStorage:', err);
  }
}

export function getActiveConversationId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
  } catch {
    return null;
  }
}

export function setActiveConversationId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_ID, id);
  } catch (err) {
    console.warn('Failed to save active conversation id:', err);
  }
}

export function createNewConversation(
  language: AssistantLanguage = 'english',
  bookContext?: BookContext,
  initialTitle?: string
): Conversation {
  const id = `conv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const title =
    initialTitle ||
    (bookContext?.bookTitle
      ? `${bookContext.bookTitle}${bookContext.chapter ? ` - ${bookContext.chapter}` : ''}`
      : `Chat ${new Date().toLocaleDateString()}`);

  const initialMessage: ChatMessage = {
    id: `msg-${Date.now()}`,
    role: 'assistant',
    content: getGreetingForLanguage(language),
    timestamp: timeStr,
    language,
    bookContext,
    followUps: getDefaultFollowUps(language),
  };

  const newConv: Conversation = {
    id,
    title,
    createdAt: now,
    updatedAt: now,
    language,
    bookContext,
    messages: [initialMessage],
  };

  const existing = getStoredConversations();
  const updated = [newConv, ...existing];
  saveConversations(updated);
  setActiveConversationId(id);

  return newConv;
}

export function getOrCreateActiveConversation(
  defaultLanguage: AssistantLanguage = 'english',
  bookContext?: BookContext
): Conversation {
  const conversations = getStoredConversations();
  const activeId = getActiveConversationId();

  if (activeId) {
    const found = conversations.find((c) => c.id === activeId);
    if (found) return found;
  }

  if (conversations.length > 0) {
    setActiveConversationId(conversations[0].id);
    return conversations[0];
  }

  return createNewConversation(defaultLanguage, bookContext);
}

export function updateConversation(
  convId: string,
  updater: (prev: Conversation) => Conversation
): Conversation[] {
  const conversations = getStoredConversations();
  const idx = conversations.findIndex((c) => c.id === convId);
  if (idx === -1) return conversations;

  const updatedConv = updater(conversations[idx]);
  updatedConv.updatedAt = new Date().toISOString();

  conversations[idx] = updatedConv;
  saveConversations(conversations);
  return [...conversations];
}

export function deleteConversation(convId: string): Conversation[] {
  const conversations = getStoredConversations();
  const filtered = conversations.filter((c) => c.id !== convId);
  saveConversations(filtered);

  const activeId = getActiveConversationId();
  if (activeId === convId) {
    if (filtered.length > 0) {
      setActiveConversationId(filtered[0].id);
    } else {
      try {
        localStorage.removeItem(STORAGE_KEY_ACTIVE_ID);
      } catch {}
    }
  }

  return filtered;
}

// Reader-specific chat helpers (scoped per book)
export function getStoredReaderMessages(bookId: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(`stbb_reader_chat_${bookId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredReaderMessages(bookId: string, messages: ChatMessage[]): void {
  try {
    localStorage.setItem(`stbb_reader_chat_${bookId}`, JSON.stringify(messages));
  } catch (err) {
    console.warn('Failed to save reader messages:', err);
  }
}
