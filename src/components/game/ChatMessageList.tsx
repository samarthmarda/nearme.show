import { useLayoutEffect, useRef } from "react";

export type ChatMessageView = {
  id: string;
  username: string;
  text: string;
  timestamp: string;
  fromSelf: boolean;
};

export function ChatMessageList({ messages }: { messages: ChatMessageView[] }) {
  const feedRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  useLayoutEffect(() => {
    const feed = feedRef.current;
    if (feed && stickToBottom.current) feed.scrollTop = feed.scrollHeight;
  }, [messages.length]);

  return (
    <div
      className="chat-lines chat-message-list"
      role="log"
      aria-label="Table chat messages"
      aria-live="polite"
      aria-relevant="additions text"
      ref={feedRef}
      onScroll={(event) => {
        const feed = event.currentTarget;
        stickToBottom.current =
          feed.scrollHeight - feed.scrollTop - feed.clientHeight < 36;
      }}
    >
      {messages.length === 0 ? (
        <p className="chat-empty">No messages yet. Say hello to your table.</p>
      ) : (
        messages.map((message) => (
          <article
            className={`chat-message ${message.fromSelf ? "sent-message" : "received-message"}`}
            key={message.id}
          >
            <header>
              <b>{message.username}</b>
              <time dateTime={message.timestamp}>
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </header>
            <p>{message.text}</p>
          </article>
        ))
      )}
    </div>
  );
}
