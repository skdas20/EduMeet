class WaitingParticipant {
  constructor(id, socketId, name, isTeacher = false) {
    this.id = id;
    this.socketId = socketId;
    this.name = name;
    this.isTeacher = isTeacher;
    this.joinedAt = new Date();
    this.requestedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      socketId: this.socketId,
      name: this.name,
      isTeacher: this.isTeacher,
      joinedAt: this.joinedAt,
      requestedAt: this.requestedAt
    };
  }
}

module.exports = WaitingParticipant;
