import express from 'express';
import ViteExpress from 'vite-express';
import expressWs from 'express-ws';
import { type ClientMessage, MessageType } from '../shared/draw-v1';
import { Room } from './Room';
import { mapIter } from './utils';
import { parseArgs } from 'util';

const app = express();
const ws = expressWs(app);
const privateRooms = new Map<string, Room>();
const publicRooms = new Map<string, Room>();

const { values: { print } } = parseArgs({
  options: {
    'print': {
      type: 'boolean',
      default: false
    }
  }
});

ws.app.ws('/', (ws, req) => {

  let room: Room | undefined;
  let roomsMap: Map<string, Room>;

  ws.on('message', e => {
    const msg = JSON.parse(e.toString()) as ClientMessage;

    switch (msg.type) {
      case MessageType.LOGIN_REQUEST:
        [room, roomsMap] = getOrCreateRoom(msg.room_id);
        printRooms();
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
    if (roomsMap && room && !room.players.length) {
      roomsMap.delete(room.id);
      printRooms();
    }
  })
});

const port = 3000;
ViteExpress.listen(app, port, () => {
  console.log(`Server is listening at port ${port}`);
});

function getOrCreateRoom(id?: string): [Room, Map<string, Room>] {
  const roomsMap = id ? privateRooms : publicRooms;

  if (!id) {
    if (publicRooms.size) {
      const allRooms = [...publicRooms.values()]
        .filter(r => r.players.length < 8);

      const room = allRooms[Math.floor(Math.random() * allRooms.length)];
      if (room) return [room, publicRooms];
    }

    id = crypto.randomUUID();
  }

  const existing = roomsMap.get(id);
  if (existing) return [existing, roomsMap];

  const room = new Room(id);
  roomsMap.set(id, room);
  return [room, roomsMap];
}

function printRooms() {
  if (!print) return;

  console.clear();

  function mapRoom(type: string) {
    return function (room: Room) {
      return {
        id: room.id,
        players: room.players.length,
        type
      }
    }
  }

  const allRooms = [
    ...mapIter(publicRooms.values(), mapRoom('public')),
    ...mapIter(privateRooms.values(), mapRoom('private'))
  ];

  for (const { id, players, type } of allRooms) {
    console.log(type, players, id);
  }
}

