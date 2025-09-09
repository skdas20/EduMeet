class Room {
  constructor(id, router) {
    this.id = id;
    this.router = router;
    this.participants = new Map(); // participantId -> Participant
    this.waitingParticipants = new Map(); // participantId -> WaitingParticipant
    this.createdAt = new Date();
    this.isRecording = false;
    this.recordingData = null;
    this.breakoutRooms = new Map(); // breakoutId -> Room
    this.creator = null; // First teacher who created the room
    this.settings = {
      allowScreenShare: true,
      allowChat: true,
      allowCanvas: true,
      maxParticipants: 50,
      recordingEnabled: false,
      muteOnJoin: false,
      videoOffOnJoin: false,
      waitingRoomEnabled: true, // Enable by default for better security
    };
  }

  getParticipant(participantId) {
    return this.participants.get(participantId);
  }

  addParticipant(participant) {
    this.participants.set(participant.id, participant);
  }

  removeParticipant(participantId) {
    return this.participants.delete(participantId);
  }

  getParticipants() {
    return Array.from(this.participants.values());
  }

  getParticipantCount() {
    return this.participants.size;
  }

  getTeachers() {
    return this.getParticipants().filter(p => p.isTeacher);
  }

  getStudents() {
    return this.getParticipants().filter(p => !p.isTeacher);
  }

  // Waiting room methods
  addWaitingParticipant(waitingParticipant) {
    this.waitingParticipants.set(waitingParticipant.id, waitingParticipant);
  }

  removeWaitingParticipant(participantId) {
    return this.waitingParticipants.delete(participantId);
  }

  getWaitingParticipants() {
    return Array.from(this.waitingParticipants.values());
  }

  getWaitingParticipant(participantId) {
    return this.waitingParticipants.get(participantId);
  }

  setCreator(participantId) {
    if (!this.creator) {
      this.creator = participantId;
    }
  }

  isCreator(participantId) {
    return this.creator === participantId;
  }

  canAdmitParticipants(participantId) {
    const participant = this.getParticipant(participantId);
    return participant && (participant.isTeacher || this.isCreator(participantId));
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
  }

  toJSON() {
    return {
      id: this.id,
      participants: this.getParticipants().map(p => p.toJSON()),
      waitingParticipants: this.getWaitingParticipants().map(wp => ({
        id: wp.id,
        name: wp.name,
        joinedAt: wp.joinedAt
      })),
      participantCount: this.getParticipantCount(),
      waitingCount: this.waitingParticipants.size,
      createdAt: this.createdAt,
      isRecording: this.isRecording,
      settings: this.settings,
      breakoutRooms: Array.from(this.breakoutRooms.keys()),
      creator: this.creator
    };
  }
}

module.exports = Room;