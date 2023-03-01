import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const TOKEN = 'token';

export const fetchCart = createAsyncThunk("cart/items", async () => {
  const token = window.localStorage.getItem(TOKEN);
  try {
    const { data: {id, cartItems} } = await axios.get(`/api/carts`, {
      headers: {
        authorization: token,
      }
    });

    return {cartId: id, cartItems, error: null};
  } catch (err) {
    console.error(err);
  }
});

export const updateQty = createAsyncThunk("cart/updateItem", async ({itemId, qty, cartId}) => {
  const token = window.localStorage.getItem(TOKEN);
  try {
    const { data: {id, cartItems} } = await axios.put(`/api/carts/item/${itemId}`, {
      qty, cartId,
      headers: {
        authorization: token
      }
    });

    console.log('cartItems', cartItems)

    return {cartId: id, cartItems, error: null};

  } catch (err) {
    console.error(err);
  }
})

export const cartSlice = createSlice({
  name: "cart",
  initialState: {
    cartId: null,
    cartItems: [],
    error: null,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchCart.fulfilled, (state, action) => {
      return action.payload;
    });
    builder.addCase(updateQty.fulfilled, (state, action) => {
      return action.payload;
    });
  }
});

export const selectCart = (state) => state.cart;

export default cartSlice.reducer;
