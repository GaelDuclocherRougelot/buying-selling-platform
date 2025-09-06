'use client';

import MessageStatus from '@/components/messages/MessageStatus';
import { useSession } from '@/lib/auth-client';
import { useMessages } from '@/lib/hooks/useMessages';
import { Conversation } from '@/types/conversation';
import { ArrowLeft } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import ChatWindow from './ChatWindow';
import ConversationsList from './ConversationsList';

export default function MessagesPage() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Hook de messagerie REST
  const {
    fetchConversations: fetchConversationsFromHook,
    fetchConversationMessages,
    sendMessage: sendMessageFromHook,
    markMessagesAsRead,
    refreshMessages,
  } = useMessages();

  // Référence pour le polling
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const conversationsData = await fetchConversationsFromHook();
      setConversations(conversationsData);
    } catch (error) {
      console.error('💥 Erreur lors du chargement des conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchConversationsFromHook]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchConversations();
    }
  }, [session?.user?.id, fetchConversations]);

  const fetchConversationMessagesLocal = async (conversationId: string) => {
    try {
      // Récupérer la conversation complète depuis la liste
      const conversation = conversations.find(
        conv => conv.id === conversationId
      );
      if (!conversation) {
        throw new Error('Conversation non trouvée');
      }

      // Récupérer les messages
      const messages = await fetchConversationMessages(conversationId);

      // Retourner la conversation complète avec les messages
      return {
        ...conversation,
        messages: messages || [],
      };
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
    }
    return null;
  };

  const handleConversationSelect = async (conversation: Conversation) => {
    // Arrêter le polling de la conversation précédente
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }

    // Fetcher les messages complets de cette conversation
    setLoadingMessages(true);
    try {
      const fullConversation = await fetchConversationMessagesLocal(
        conversation.id
      );
      if (fullConversation) {
        // Chargement des messages complets de la conversation
        setSelectedConversation(fullConversation);

        // Marquer les messages comme lus
        await markMessagesAsRead(conversation.id);

        // Démarrer le polling pour cette conversation
        startPolling(conversation.id);
      } else {
        // Fallback si le fetch échoue
        toast.error('❌ Erreur serveur, impossible de charger les messages');
        setSelectedConversation(conversation);
      }
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (
    conversationId: string,
    content: string,
    messageType: 'text' | 'image' | 'file' | 'mixed' = 'text'
  ) => {
    if (!content.trim() || !session?.user?.id) return;

    const newMessage = await sendMessageFromHook(
      conversationId,
      content.trim(),
      messageType
    );

    if (newMessage && selectedConversation) {
      // Ajouter le message à la conversation actuelle
      setSelectedConversation((prev: Conversation | null) => ({
        ...prev!,
        messages: [...(prev?.messages || []), newMessage],
      }));

      // Mettre à jour la liste des conversations
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? {
                ...conv,
                lastMessage: newMessage,
                updatedAt: new Date().toISOString(),
              }
            : conv
        )
      );
    }
  };

  // Fonction pour démarrer le polling d'une conversation
  const startPolling = useCallback(
    (conversationId: string) => {
      // Arrêter le polling précédent
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
      }

      // Démarrer le polling toutes les 5 secondes
      const poll = async () => {
        if (selectedConversation?.id === conversationId) {
          const messages = await refreshMessages(
            conversationId,
            lastMessageIdRef.current || undefined
          );

          if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            lastMessageIdRef.current = lastMessage.id;

            // Mettre à jour la conversation si de nouveaux messages sont arrivés
            if (
              messages.length > (selectedConversation.messages?.length || 0)
            ) {
              setSelectedConversation((prev: Conversation | null) => ({
                ...prev!,
                messages,
              }));

              // Marquer comme lus
              await markMessagesAsRead(conversationId);
            }
          }
        }

        // Continuer le polling
        pollingRef.current = setTimeout(poll, 5000);
      };

      poll();
    },
    [
      markMessagesAsRead,
      refreshMessages,
      selectedConversation?.id,
      selectedConversation?.messages?.length,
    ]
  );

  // Nettoyer le polling au démontage
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className='w-full max-w-7xl mx-auto p-6'>
        <div className='flex items-center justify-center h-64'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
        </div>
      </div>
    );
  }

  return (
    <div className='w-full max-w-7xl mx-auto p-6'>
      <div className='mb-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>Messages</h1>
            <p className='text-gray-600 mt-2'>
              Gérez vos conversations avec les acheteurs et vendeurs
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <MessageStatus />
          </div>
        </div>
        {selectedConversation && (
          <button
            type='button'
            className='lg:hidden inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 mt-2 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 gap-2'
            onClick={() => setSelectedConversation(null)}
          >
            <ArrowLeft /> <span>Conversations</span>
          </button>
        )}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]'>
        {/* Liste des conversations */}
        <div
          className={`lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 ${
            selectedConversation ? 'hidden lg:block' : 'block'
          }`}
        >
          <ConversationsList
            conversations={conversations}
            selectedConversation={selectedConversation}
            onConversationSelect={handleConversationSelect}
            currentUserId={session?.user?.id}
          />
        </div>

        {/* Zone de chat */}
        <div
          className={`lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${
            selectedConversation ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* En-tête mobile avec bouton retour */}
          {selectedConversation && (
            <div className='lg:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-200'>
              <button
                onClick={() => setSelectedConversation(null)}
                className='inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50'
                aria-label='Retour à la liste des conversations'
              >
                ← Retour
              </button>
              <div className='ml-1 text-sm text-gray-500 truncate'>
                Conversation
              </div>
            </div>
          )}
          {selectedConversation ? (
            <ChatWindow
              conversation={selectedConversation}
              currentUserId={session?.user?.id}
              onSendMessage={handleSendMessage}
              loading={loadingMessages}
              typingUsers={new Set()}
              onTypingStatusChange={() => {}}
            />
          ) : (
            <div className='flex items-center justify-center h-full text-gray-500'>
              <div className='text-center'>
                <div className='text-6xl mb-4'>💬</div>
                <p className='text-lg'>
                  Sélectionnez une conversation pour commencer à discuter
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
