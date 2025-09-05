class Room {
  constructor(id, router) {
    this.id = id;
    this.router = router;
    this.participants = new Map(); // participantId -> Participant
    this.createdAt = new Date();
    this.isRecording = false;
    this.recordingData = null;
    this.breakoutRooms = new Map(); // breakoutId -> Room
    this.settings = {
      allowScreenShare: true,
      allowChat: true,
      allowCanvas: true,
      maxParticipants: 50,
      recordingEnabled: false,
      muteOnJoin: false,
      videoOffOnJoin: false,
      waitingRoomEnabled: false,
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

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
  }

  toJSON() {
    return {
      id: this.id,
      participants: this.getParticipants().map(p => p.toJSON()),
      participantCount: this.getParticipantCount(),
      createdAt: this.createdAt,
      isRecording: this.isRecording,
      settings: this.settings,
      breakoutRooms: Array.from(this.breakoutRooms.keys())
    };
  }
}

module.exports = Room;