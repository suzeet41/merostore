import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const API = "http://localhost:5000/api/shop/order";   // base path

/* ------------------------------------------------------------------ */
/*   INITIAL STATE                                                    */
/* ------------------------------------------------------------------ */
const initialState = {
  /** Returned by create‑order */
  formUrl:   null,   // e.g. https://rc‑epay.esewa.com.np/api/epay/main/v2/form
  formData:  null,   // { amount, total_amount, transaction_uuid, ... }
  orderId:   null,

  /** Queries */
  orderList:    [],
  orderDetails: null,

  isLoading: false,
};

/* ------------------------------------------------------------------ */
/*   THUNKS                                                           */
/* ------------------------------------------------------------------ */

/* 1️⃣  Create order → get form spec */
export const createEsewaOrder = createAsyncThunk(
  "order/createEsewaOrder",
  async (orderData) => {
    const { data } = await axios.post(`${API}/esewa/create-order`, orderData);
    return data; // { formUrl, formData, orderId }
  }
);

/* 2️⃣  Verify payment from success redirect */
export const verifyEsewaPayment = createAsyncThunk(
  "order/verifyEsewaPayment",
  async ({ orderId, total_amount, transaction_uuid }) => {
    const { data } = await axios.post(`${API}/esewa/verify-payment`, {
      orderId,
      total_amount,
      transaction_uuid,
    });
    return data; // { success, data: order }
  }
);

/* 3️⃣  Queries (unchanged) */
export const getAllOrdersByUserId = createAsyncThunk(
  "order/getAllOrdersByUserId",
  async (userId) => {
    const { data } = await axios.get(`${API}/user/${userId}/orders`);
    return data; // { success, data: [...orders] }
  }
);

export const getOrderDetails = createAsyncThunk(
  "order/getOrderDetails",
  async (id) => {
    const { data } = await axios.get(`${API}/${id}`);
    return data; // { success, data: order }
  }
);

/* ------------------------------------------------------------------ */
/*   SLICE                                                            */
/* ------------------------------------------------------------------ */
const shoppingOrderSlice = createSlice({
  name: "shoppingOrderSlice",
  initialState,
  reducers: {
    resetOrderDetails(state) {
      state.orderDetails = null;
    },
    resetPaymentState(state) {
      state.formUrl  = null;
      state.formData = null;
      state.orderId  = null;
    },
  },
  extraReducers: (builder) => {
    builder
      /* ────────── CREATE ORDER ────────── */
      .addCase(createEsewaOrder.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createEsewaOrder.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.formUrl   = payload.formUrl;
        state.formData  = payload.formData;
        state.orderId   = payload.orderId;
        sessionStorage.setItem("currentOrderId", JSON.stringify(payload.orderId));
      })
      .addCase(createEsewaOrder.rejected, (state) => {
        state.isLoading = false;
        state.formUrl   = null;
        state.formData  = null;
        state.orderId   = null;
      })

      /* ────────── VERIFY PAYMENT ───────── */
      .addCase(verifyEsewaPayment.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(verifyEsewaPayment.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        // you might want to merge the confirmed order into orderDetails here
        state.orderDetails = payload.data;
      })
      .addCase(verifyEsewaPayment.rejected, (state) => {
        state.isLoading = false;
      })

      /* ────────── LIST ORDERS ─────────── */
      .addCase(getAllOrdersByUserId.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllOrdersByUserId.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.orderList = payload.data;
      })
      .addCase(getAllOrdersByUserId.rejected, (state) => {
        state.isLoading = false;
        state.orderList = [];
      })

      /* ────────── ORDER DETAILS ───────── */
      .addCase(getOrderDetails.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getOrderDetails.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.orderDetails = payload.data;
      })
      .addCase(getOrderDetails.rejected, (state) => {
        state.isLoading = false;
        state.orderDetails = null;
      });
  },
});

export const { resetOrderDetails, resetPaymentState } =
  shoppingOrderSlice.actions;

export default shoppingOrderSlice.reducer;
