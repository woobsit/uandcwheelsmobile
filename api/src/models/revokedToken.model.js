// src/models/revokedToken.model.js
const { Model, DataTypes } = require( 'sequelize');
const sequelize = require( '../config/config');

class RevokedToken extends Model {
 
}

RevokedToken.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
     token: {
       type: DataTypes.STRING(512),
       allowNull: false,
       unique: true,
     },
     expires_at: {
       type: DataTypes.DATE,
       allowNull: false,
       field: 'expires_at', // Explicitly mapping to the column name
    },
    //  user_id: {
    //    type: DataTypes.INTEGER,
    //    allowNull: true,  //Optional as per your schema
    //    references: {
    //      model: 'users',  //This references the 'users' table
    //      key: 'id',
    //    },
    //  },
  },
  {
    sequelize,
    modelName: 'revoked_token',
    tableName: 'revoked_tokens',
    timestamps: false, // Disable createdAt/updatedAt
    underscored: true, // Use snake_case for automatic field mapping
  }
);

module.exports = RevokedToken;