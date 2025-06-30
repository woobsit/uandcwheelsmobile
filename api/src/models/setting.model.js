const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/config');

class Setting extends Model {
  static async getAllSettings() {
    const settings = await this.findAll();
    return settings.reduce((acc, setting) => {
      // Convert value based on data type
      let value = setting.value;
      switch(setting.data_type) {
        case 'number':
          value = Number(value);
          break;
        case 'boolean':
          value = value === 'true';
          break;
        case 'json':
          try { value = JSON.parse(value); } 
          catch { value = null; }
          break;
      }
      acc[setting.name] = value;
      return acc;
    }, {});
  }

  static async updateSettings(updates) {
    const transaction = await sequelize.transaction();
    try {
      for (const [name, value] of Object.entries(updates)) {
        const setting = await this.findOne({ where: { name }, transaction });
        if (setting) {
          let stringValue = value;
          if (typeof value === 'object') {
            stringValue = JSON.stringify(value);
            setting.data_type = 'json';
          } else if (typeof value === 'boolean') {
            stringValue = value.toString();
            setting.data_type = 'boolean';
          } else if (typeof value === 'number') {
            stringValue = value.toString();
            setting.data_type = 'number';
          }
          
          await setting.update({ value: stringValue }, { transaction });
        }
      }
      await transaction.commit();
      return this.getAllSettings();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

Setting.init(
  {
    name: DataTypes.STRING,
    value: DataTypes.TEXT,
    data_type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
  },
  {
    sequelize,
    modelName: 'setting',
    timestamps: true,
  }
);