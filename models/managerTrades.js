const tradeSchema = new Schema(
    {
      manager: { 
        type: Schema.Types.ObjectId, 
        ref: 'manager', 
        required: true },
      symbol : { 
        type: String, 
        required: true },
      manager_volume : {
        type :String ,
        required : true},
      type : {
        type :String ,
        enum:['buy','sell'],
        required : true},
      open_price: { 
        type: String, 
        required: true }, 
      close_price: { 
        type: String, 
        required: true }, 
      swap : {
        type : String, 
        default : 0},
      open_time: { 
        type: String, 
        required: true }, 
      close_time: { 
        type: String, 
        required: true }, 
      manager_profit: { 
        type: Number, 
        required: true }, 
      createdAt: { 
        type: Date, 
        default: Date.now, 
        index: true },
    },
    {
      timestamps: true, 
    }
  );
  
  const Trade = mongoose.model('manager_trades', tradeSchema);
  