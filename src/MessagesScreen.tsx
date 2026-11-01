import { type KeyboardEvent, useState } from "react"
import { Badge, Button, InputField } from "@figma/astraui"

type Message = {
  id: number
  sender: "me" | "them"
  text: string
  time: string
}

type Conversation = {
  id: number
  person: string
  property: string
  preview: string
  time: string
  unread: boolean
  messages: Message[]
}

function conversationsForRole(role: "Tenant" | "Owner"): Conversation[] {
  if (role === "Owner") {
    return [
      {
        id: 1,
        person: "Araf Rahman",
        property: "Lakeview Heights, Flat 4B",
        preview: "I have completed the rent payment.",
        time: "10:42 AM",
        unread: true,
        messages: [
          {
            id: 1,
            sender: "them",
            text: "Hello, I wanted to confirm the maintenance visit tomorrow.",
            time: "10:18 AM",
          },
          {
            id: 2,
            sender: "me",
            text: "The technician will arrive between 11 AM and noon.",
            time: "10:24 AM",
          },
          {
            id: 3,
            sender: "them",
            text: "Thank you. I have also completed the rent payment.",
            time: "10:42 AM",
          },
        ],
      },
      {
        id: 2,
        person: "Samira Hossain",
        property: "Gulshan Avenue Residence",
        preview: "Could we discuss the renewal terms?",
        time: "Yesterday",
        unread: true,
        messages: [
          {
            id: 1,
            sender: "them",
            text: "Could we discuss the renewal terms this week?",
            time: "Yesterday",
          },
        ],
      },
      {
        id: 3,
        person: "Nafis Ahmed",
        property: "Uttara Garden House",
        preview: "The technician has finished the work.",
        time: "Mon",
        unread: false,
        messages: [
          {
            id: 1,
            sender: "them",
            text: "The technician has finished the work. Everything is working.",
            time: "Monday",
          },
        ],
      },
    ]
  }

  return [
    {
      id: 1,
      person: "Farhana Ahmed",
      property: "Lakeview Heights, Flat 4B",
      preview: "The technician will arrive tomorrow.",
      time: "10:24 AM",
      unread: true,
      messages: [
        {
          id: 1,
          sender: "me",
          text: "Hello, could you confirm when the plumber will visit?",
          time: "10:12 AM",
        },
        {
          id: 2,
          sender: "them",
          text: "The technician will arrive tomorrow between 11 AM and noon.",
          time: "10:24 AM",
        },
      ],
    },
    {
      id: 2,
      person: "RentEase Support",
      property: "Rental application support",
      preview: "Your application documents are complete.",
      time: "Yesterday",
      unread: false,
      messages: [
        {
          id: 1,
          sender: "them",
          text: "Your application documents are complete and ready for review.",
          time: "Yesterday",
        },
      ],
    },
    {
      id: 3,
      person: "Mahmud Karim",
      property: "Dhanmondi Family Apartment",
      preview: "The apartment is available from November.",
      time: "Mon",
      unread: false,
      messages: [
        {
          id: 1,
          sender: "them",
          text: "The apartment is available from the first week of November.",
          time: "Monday",
        },
      ],
    },
  ]
}

export default function MessagesScreen({ role }: { role: "Tenant" | "Owner" }) {
  const [conversations, setConversations] = useState(() =>
    conversationsForRole(role),
  )
  const [selectedId, setSelectedId] = useState(conversations[0].id)
  const [draft, setDraft] = useState("")
  const selected =
    conversations.find((conversation) => conversation.id === selectedId) ??
    conversations[0]

  const selectConversation = (id: number) => {
    setSelectedId(id)
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === id
          ? { ...conversation, unread: false }
          : conversation,
      ),
    )
  }

  const send = () => {
    if (!draft.trim()) return
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === selectedId
          ? {
              ...conversation,
              preview: draft,
              time: "Now",
              messages: [
                ...conversation.messages,
                {
                  id: Date.now(),
                  sender: "me",
                  text: draft,
                  time: "Now",
                },
              ],
            }
          : conversation,
      ),
    )
    setDraft("")
  }

  const sendWithKeyboard = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") send()
  }

  return (
    <div className="rent-page-content flex h-full min-h-0 flex-col p-xl md:p-2xl">
      <div className="mb-xl">
        <div className="text-title text-text-primary">Messages</div>
        <div className="mt-xs text-label-sm text-text-secondary">
          Keep every property conversation in one place.
        </div>
      </div>

      <div className="messages-layout dashboard-card min-h-0 flex-1 overflow-hidden rounded-corner-lg border border-border-primary bg-surface-bg">
        <aside className="conversation-list border-r border-border-primary">
          <div className="border-b border-border-primary p-xl">
            <div className="text-heading text-text-primary">Conversations</div>
            <div className="mt-xs text-video-title text-text-secondary">
              {conversations.filter((item) => item.unread).length} unread
            </div>
          </div>
          <div className="conversation-scroll">
            {conversations.map((conversation) => (
              <Button
                key={conversation.id}
                variant="subtle"
                className={`conversation-button w-full ${
                  selectedId === conversation.id ? "bg-brand-muted" : ""
                }`}
                onClick={() => selectConversation(conversation.id)}
              >
                <span className="flex w-full items-start gap-lg text-left">
                  <span className="conversation-avatar flex shrink-0 items-center justify-center rounded-corner-full bg-bg-faint text-label-sm text-brand-dark">
                    {conversation.person
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-md">
                      <span className="truncate text-label-sm text-text-primary">
                        {conversation.person}
                      </span>
                      <span className="text-video-title text-text-secondary">
                        {conversation.time}
                      </span>
                    </span>
                    <span className="mt-xs block truncate text-video-title text-brand-primary">
                      {conversation.property}
                    </span>
                    <span className="mt-xs flex items-center gap-md">
                      <span className="truncate text-video-title text-text-secondary">
                        {conversation.preview}
                      </span>
                      {conversation.unread ? (
                        <span
                          className="unread-dot shrink-0 rounded-corner-full bg-brand-primary"
                          aria-label="Unread"
                        />
                      ) : null}
                    </span>
                  </span>
                </span>
              </Button>
            ))}
          </div>
        </aside>

        <section className="chat-panel flex min-h-0 flex-col">
          <div className="flex items-center justify-between border-b border-border-primary p-xl">
            <div>
              <div className="text-label text-text-primary">
                {selected.person}
              </div>
              <div className="mt-xs text-video-title text-text-secondary">
                {selected.property}
              </div>
            </div>
            <Badge label="Online" variant="success" />
          </div>

          <div className="chat-thread flex min-h-0 flex-1 flex-col gap-lg overflow-y-auto p-xl">
            {selected.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "me" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`message-bubble ${
                    message.sender === "me"
                      ? "bg-brand-primary text-on-brand"
                      : "bg-bg-faint text-text-primary"
                  }`}
                >
                  <div className="text-label-sm">{message.text}</div>
                  <div
                    className={`mt-xs text-video-title ${
                      message.sender === "me"
                        ? "text-on-brand"
                        : "text-text-secondary"
                    }`}
                  >
                    {message.time}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-md border-t border-border-primary p-xl">
            <div className="flex-1">
              <InputField
                placeholder="Write a message"
                value={draft}
                onChange={setDraft}
                onKeyDown={sendWithKeyboard}
                aria-label="Message"
              />
            </div>
            <Button variant="primary" onClick={send}>
              Send
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
