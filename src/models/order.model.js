const log = require('../services/log')('user.model');
import config               from '../config'
import CONST                from '../const'
import mongoose             from 'mongoose'
import mongoose_delete from 'mongoose-delete';
mongoose.Promise            = require('bluebird');
import _ from 'lodash'
import pbkdf2 from '../services/pbkdf2'
import validation from '../services/validation'

const AutoIncrement = require('mongoose-sequence')(mongoose);
const Schema = mongoose.Schema;

const PersonalInfoSchema = new Schema({
  fullName: {type: String, default: ''},
  email: {type: String, default: ''},
  phone: {type: String, default: ''},
}, {_id: false})

const LicenseSchema = new Schema({
  name: {type: String, default: ''},
  stateName: {type: String, default: ''}
}, {_id: false})

const CarInfoSchema = new Schema({
  mileage: {type: String, default: ''},
  year: {type: String, default: ''},
  make: {type: String, default: ''},
  model: {type: String, default: ''},
  option: {type: String, default: ''}
}, {_id: false})

const DrivingStyleSchema = new Schema({
  options: {type: Array, default: []},
  notes: {type: String, default: ''}
}, {_id: false})

const LocationSchema = new Schema({
  street: {type: String, default: ''},
  city: {type: String, default: ''},
  stateName: {type: String, default: ''},
  type: {type: String, default: ''},
  zipCode: {type: String, default: ''},
  notes: {type: String, default: ''},
}, {_id: false})

const PreferenceSchema = new Schema({
  message: {type: String, default: ''},
  options: {type: Array, default: []},
  notes: {type: String, default: ''}
}, {_id: false})

const ServiceTypeSchema = new Schema({
  name: {
    type: String,
    enum: [
      CONST.SERVICE_TYPE.INSTALL_AND_TIRES,
      CONST.SERVICE_TYPE.INSTALL_ONLY,
      CONST.SERVICE_TYPE.ROTATION,
      CONST.SERVICE_TYPE.REPAIR,
      ''
    ],
    default: ''
  },
  installationType: {
    type: String,
    enum: [
      CONST.INSTALLATION_TYPE.CAR_ENTHUSIAST,
      CONST.INSTALLATION_TYPE.AMATURE,
      ''
    ],
    default: ''
  }
}, {_id: false})

const SizesSchema = new Schema({
  frontNumber: {type: Number, default: 0},
  frontSize: {type: String, default: ''},
  rearNumber: {type: Number, default: 0},
  rearSize: {type: String, default: ''},
}, {_id: false})

const TireInfoSchema = new Schema({
  [CONST.TIRE_TYPE.FRONT]: {type: Object, default: {brand: '', model: '', type: '', range: ''}},
  [CONST.TIRE_TYPE.REAR]:  {type: Object, default: {brand: '', model: '', type: '', range: ''}}
}, {_id: false})

const orderSchema = new Schema({
  addons: {type: Array, default: []},
  adminNotes: {type: String, default: '', select: false},
  carInfo: {type: CarInfoSchema, default: {}},
  createdAt: {type: Date, default: Date.now},
  details: {type: String, default: ''},
  dotCode: {type: String, default: ''},
  drivingStyle: {type: DrivingStyleSchema, default: {}},
  flatLocations: {type: Array, default: []},
  license: {type: LicenseSchema, default: {}},
  location: {type: LocationSchema, default: {}},
  personalInfo: {type: PersonalInfoSchema, default: {}},
  photos: {type: Object, default: {}},
  preference: {type: PreferenceSchema, default: {}},
  serviceType: {type: ServiceTypeSchema, default: {}},
  sizes: {type: SizesSchema, default: {}},
  status: {type: Number, default: CONST.ORDER_STATUS.DRAFT},
  times: {type: Array, default: []},
  tireInfo: {type: TireInfoSchema, default: {}},
  tireOptionsType: {type: String, enum: [CONST.TIRE_OPTIONS_TYPE.RECOMMENDED, CONST.TIRE_OPTIONS_TYPE.SAME ]}
}, { usePushEach: true, minimize: false });

orderSchema.plugin(mongoose_delete,{ deletedAt : true, overrideMethods: true });

// add autoincremented id
orderSchema.plugin(AutoIncrement, {inc_field: 'id'});
// make "id" as string
orderSchema.remove('id')
orderSchema.add({ id: {type: String} })

const ModelClass = mongoose.model( 'Order', orderSchema );
export default ModelClass;