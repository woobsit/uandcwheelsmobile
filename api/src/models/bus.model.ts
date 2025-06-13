// models/bus.model.ts
import { Model, DataTypes } from 'sequelize';
import db from '../config/config';

interface BusAttributes {
  id: number;
  plate_number: string;
  brand: string;
  model: string;
  capacity: number;
  status: 'active' | 'maintenance' | 'retired';
}

class Bus extends Model<BusAttributes> implements BusAttributes {
  public id!: number;
  public plate_number!: string;
  public brand!: string;
  public model!: string;
  public capacity!: number;
  public status!: 'active' | 'maintenance' | 'retired';
}

Bus.init({
  // ...field definitions
}, { sequelize: db, modelName: 'bus' });

export default Bus;