import Invitation from "../models/InvitationModel.js";
import Board from "../models/boardModel.js";

// Creare invitație
export const createInvitation = async (req, res) => {
  const { boardId, userId } = req.body;

  console.log(
    "Creating invitation with boardId:",
    boardId,
    "and userId:",
    userId
  );

  try {
    const newInvitation = new Invitation({
      boardId,
      userId,
    });
    await newInvitation.save();
    res.status(201).json(newInvitation);
  } catch (error) {
    console.error("Failed to create invitation:", error);
    res.status(500).json({ message: "Failed to create invitation", error });
  }
};

// Acceptare invitație
export const acceptInvitation = async (req, res) => {
  console.log(req.params);
  const { invitationId } = req.params; // Modifică pentru a folosi req.params

  try {
    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    invitation.status = "accepted";
    await invitation.save();

    const board = await Board.findById(invitation.boardId);
    if (!board.collaborators.includes(invitation.userId)) {
      board.collaborators.push(invitation.userId);
      await board.save();
    }

    console.log(`Updated board: ${board}`);

    res.status(200).json({ message: "Invitation accepted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to accept invitation", error });
  }
};

// Respingere invitație
export const declineInvitation = async (req, res) => {
  const { invitationId } = req.params; // Modifică pentru a folosi req.params

  try {
    const invitation = await Invitation.findById(invitationId);
    if (!invitation)
      return res.status(404).json({ message: "Invitation not found" });

    invitation.status = "declined";
    await invitation.save();

    // Elimina colaboratorul din board
    const board = await Board.findById(invitation.boardId);
    if (board) {
      board.collaborators = board.collaborators.filter(
        (collaboratorId) => !collaboratorId.equals(invitation.userId)
      );
      await board.save();
    }

    res.status(200).json({ message: "Invitation declined" });
  } catch (error) {
    res.status(500).json({ message: "Failed to decline invitation", error });
  }
};

// Obținerea invitațiilor pentru un utilizator
export const getUserInvitations = async (req, res) => {
  try {
    const invitations = await Invitation.find({
      userId: req.user._id,
      status: "pending",
    }).populate("boardId"); // Include toate detaliile boardului

    res.status(200).json(invitations); // Trimite direct invitațiile fără modificări
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch invitations", error });
  }
};
