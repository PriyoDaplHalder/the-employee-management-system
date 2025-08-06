import dbConnect from '@/lib/mongodb';
import PositionSchema from '@/model/Position';

export async function GET() {
  await dbConnect();
  try {
    const positions = await PositionSchema.find({}).sort({ name: 1 });
    return Response.json({ positions: positions.map((p) => p.name) });
  } catch (err) {
    return Response.json({ error: 'Failed to fetch positions' }, { status: 500 });
  }
}

export async function POST(req) {
  await dbConnect();
  try {
    const { name } = await req.json();
    if (!name || typeof name !== 'string') {
      return Response.json({ error: 'Invalid position name' }, { status: 400 });
    }
    const exists = await PositionSchema.findOne({ name });
    if (exists) {
      return Response.json({ error: 'Position already exists' }, { status: 409 });
    }
    const position = await PositionSchema.create({ name });
    return Response.json({ position });
  } catch (err) {
    return Response.json({ error: 'Failed to create position' }, { status: 500 });
  }
}
