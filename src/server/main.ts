import express from 'express';
import ViteExpress from 'vite-express';
import expressWs from 'express-ws';
import { MessageType, type Message } from '../shared/draw-v1';
import { Room } from './Room';

const app = express();
const ws = expressWs(app);
const rooms = new Map<string, Room>();

ws.app.ws('/', (ws, req) => {

  let room: Room | undefined;

  ws.on('message', e => {
    const msg = JSON.parse(e.toString()) as Message;

    switch (msg.type) {
      case MessageType.LOGIN_REQUEST:
        room = getOrCreateRoom(msg.room_id);
        const { name, avatar, avatar_bg } = msg;
        room.newClient({ name, avatar_bg, avatar }, ws);
        break;

      default:
        room?.handleMessage(ws, msg);
        break;
    }
  });

  ws.on('close', code => {
    room?.removeClient(ws, 'left');
    if (room && !room.players.length) {
      rooms.delete(room.id);
    }
  })
})

function getOrCreateRoom(id?: string): Room {
  if (!id) {
    if (rooms.size) {
      const allRooms = [...rooms.values()];
      return allRooms[Math.floor(Math.random() * allRooms.length)];
    }

    id = generateId();
  }

  const existing = rooms.get(id);
  if (existing) return existing;

  const room = new Room(id);
  rooms.set(id, room);
  return room;
}

function generateId(): string {
  return crypto.randomUUID();
}

const port = 3000;
ViteExpress.listen(app, port, () => {
  console.log(`Server is listening at port ${port}`);
});

