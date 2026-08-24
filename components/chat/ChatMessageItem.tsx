'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { sanitizeSchema } from '@/lib/markdown';
import 'katex/dist/katex.min.css';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChatMessageResponse } from '@/types/chat';
import { parseDateSafe } from '@/lib/utils';

interface ChatMessageItemProps {
  message: ChatMessageResponse;
  isMe: boolean;
}

const katexConfig = {
  throwOnError: false,
  errorColor: '#64748b',
};

export function ChatMessageItem({ message, isMe }: ChatMessageItemProps) {
  const d = parseDateSafe(message.createdAt);
  const formattedTime = d
    ? d.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className={`flex items-end gap-2 my-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isMe && (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={message.senderAvatar} alt={message.senderName} />
          <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-bold">
            {getInitials(message.senderName)}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
        {!isMe && (
          <span className="text-[11px] text-gray-500 font-medium mb-1 px-1">
            {message.senderName}
          </span>
        )}

        <div
          className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
            isMe
              ? 'bg-indigo-600 text-white rounded-br-none shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-none shadow-sm'
          }`}
        >
          <div className="prose dark:prose-invert text-sm max-w-none break-words">
            <ReactMarkdown
              remarkPlugins={[remarkMath, remarkGfm]}
              rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema], [rehypeKatex, katexConfig]]}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>

        <span className="text-[10px] text-gray-400 mt-1 px-1 flex items-center gap-1">
          {formattedTime}
          {isMe && (
            <span className={message.isRead ? 'text-indigo-500' : 'text-gray-300'}>
              {message.isRead ? '✓✓' : '✓'}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
