import { supabase } from '../supabase';
import type { Message, Conversation } from '../../types';

export interface DBMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  timestamp: string;
}

// Fetch messages between two users
export async function getMessagesBetweenUsers(userId1: string, userId2: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
    .order('timestamp', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return (data || []).map((msg: DBMessage) => ({
    id: msg.id,
    senderId: msg.sender_id,
    senderName: msg.sender_id === userId1 ? 'You' : 'Contact',
    content: msg.content,
    timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isOwn: msg.sender_id === userId1,
  }));
}

// Send a message via Supabase
export async function sendDBMessage(senderId: string, receiverId: string, content: string): Promise<Message | null> {
  const { data, error } = await supabase
    .from('messages')
    .insert([
      {
        sender_id: senderId,
        receiver_id: receiverId,
        content: content,
        timestamp: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error sending message:', error);
    return null;
  }

  return {
    id: data.id,
    senderId: data.sender_id,
    senderName: 'You',
    content: data.content,
    timestamp: new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isOwn: true,
  };
}

// Fetch all conversation contacts for a given user
export async function getUserConversations(userId: string): Promise<Conversation[]> {
  // Fetch distinct users interacted with or all registered users/brokers
  const { data: userMessages, error } = await supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching user messages:', error);
  }

  // Get list of contact IDs
  const contactMap = new Map<string, { lastMsg: string; time: string; unread: number }>();

  if (userMessages) {
    userMessages.forEach((msg: DBMessage) => {
      const contactId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      if (!contactMap.has(contactId)) {
        contactMap.set(contactId, {
          lastMsg: msg.content,
          time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread: 0,
        });
      }
    });
  }

  // Fetch profiles for these contact IDs
  const { data: usersData } = await supabase.from('users').select('*');

  const conversations: Conversation[] = [];

  if (usersData) {
    usersData
      .filter((u: any) => u.id !== userId)
      .forEach((u: any) => {
        const meta = contactMap.get(u.id);
        conversations.push({
          id: u.id,
          contactName: u.full_name || u.email || 'User',
          contactAvatar: u.avatar || '',
          lastMessage: meta?.lastMsg || 'Tap to start conversation',
          timestamp: meta?.time || '',
          unread: meta?.unread || 0,
          online: true,
        });
      });
  }

  return conversations;
}
