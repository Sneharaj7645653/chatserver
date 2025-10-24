// Controller for chat-related endpoints.
// This file exposes handlers used by the chat routes to create chats,
// list chats, add/get conversations, and delete chats.
// Handlers assume `req.user` is populated by authentication middleware.
import { Chat } from "../models/Chat.js";
import { Conversation } from "../models/Conversation.js";

/**
 * Create a new chat for the authenticated user.
 * - Input: expects `req.user._id` to identify the owner.
 * - Output: JSON representation of the created `Chat` document.
 * - Errors: returns 500 on unexpected errors.
 */
export const createChat = async (req, res) => {
  try {
    // The authentication middleware should attach the user to req.user
    const userId = req.user._id;

    // Create a new chat document linked to the user
    const chat = await Chat.create({
      user: userId,
    });

    // Return the created chat to the client
    res.json(chat);
  } catch (error) {
    // Generic server error handler
    res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * Get all chats for the authenticated user, newest first.
 * - Input: uses `req.user._id` to filter chats.
 * - Output: Array of Chat documents sorted by `createdAt` descending.
 */
export const getAllChats = async (req, res) => {
  try {
    // Fetch chats belonging to the current user and show newest first
    const chats = await Chat.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    res.json(chats);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * Add a conversation (question/answer) to a chat.
 * - Path param: `:id` is the Chat id to append the conversation to.
 * - Body: expects `question` and `answer` fields.
 * - Behavior: creates a Conversation document, and updates the Chat's
 *   `latestMessage` with the new question for quick access.
 */
export const addConversation = async (req, res) => {
  try {
    // Ensure chat exists
    const chat = await Chat.findById(req.params.id);

    if (!chat)
      return res.status(404).json({
        message: "No chat with this id",
      });

    // Create a new conversation linked to this chat
    const conversation = await Conversation.create({
      chat: chat._id,
      question: req.body.question,
      answer: req.body.answer,
    });

    // Update the chat document with the latest message (question text)
    const updatedChat = await Chat.findByIdAndUpdate(
      req.params.id,
      { latestMessage: req.body.question },
      { new: true }
    );

    // Return both the created conversation and the updated chat
    res.json({
      conversation,
      updatedChat,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * Retrieve all conversations for a given chat id.
 * - Path param: `:id` is the Chat id whose conversations to return.
 */
export const getConversation = async (req, res) => {
  try {
    const conversation = await Conversation.find({ chat: req.params.id });

    if (!conversation)
      return res.status(404).json({
        message: "No conversation with this id",
      });

    res.json(conversation);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * Delete a chat if it exists and belongs to the authenticated user.
 * - Path param: `:id` is the Chat id to delete.
 * - Authorization: only the owner (chat.user) can delete the chat.
 */
export const deleteChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);

    if (!chat)
      return res.status(404).json({
        message: "No chat with this id",
      });

    // Prevent users from deleting chats they don't own
    if (chat.user.toString() !== req.user._id.toString())
      return res.status(403).json({
        message: "Unauthorized",
      });

    // Remove the chat document (conversations may remain depending on cascade rules)
    await chat.deleteOne();

    res.json({
      message: "Chat Deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};