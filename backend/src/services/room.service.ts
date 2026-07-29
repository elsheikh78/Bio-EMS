import { RoomRepository, Room } from "../repositories/room.repository";

const repository = new RoomRepository();

export function createRoom(room: Room): number {
    return repository.create(room);
}

export function getRooms(): Room[] {
    return repository.getAll();
}