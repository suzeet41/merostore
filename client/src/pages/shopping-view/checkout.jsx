/* ----------------------------------------
   ShoppingCheckout.jsx   (eSewa version)
----------------------------------------- */
import Address from "@/components/shopping-view/address";
import userImg from "../../assets/account.jpg";

import { useDispatch, useSelector } from "react-redux";
import UserCartItemsContent from "@/components/shopping-view/cart-items-content";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  createEsewaOrder,   // ⬅️ new thunk
  resetPaymentState,   // optional helper
} from "@/store/shop/order-slice";
import { toast } from "react-toastify";

function ShoppingCheckout() {
  /* ---------------- Redux state ---------------- */
  const { cartItems } = useSelector((state) => state.shopCart);
  const { user }      = useSelector((state) => state.auth);
  const { formUrl, formData, isLoading } = useSelector(
    (state) => state.shopOrder,
  );

  /* ---------------- Local UI state ------------- */
  const [currentSelectedAddress, setCurrentSelectedAddress] = useState(null);
  const dispatch = useDispatch();

  /* --------------------------------------------- */
  /*  Total cart amount                           */
  /* --------------------------------------------- */
  const totalCartAmount =
    cartItems?.items?.length
      ? cartItems.items.reduce(
          (sum, item) =>
            sum +
            (item.salePrice > 0 ? item.salePrice : item.price) *
              item.quantity,
          0,
        )
      : 0;

  /* --------------------------------------------- */
  /*  Build & submit hidden form to eSewa          */
  /* --------------------------------------------- */
  useEffect(() => {
    if (!formUrl || !formData) return;

    // 1. build the form
    const form = document.createElement("form");
    form.action = formUrl;   // https://rc‑epay.esewa.com.np/api/epay/main/v2/form
    form.method = "POST";

    Object.entries(formData).forEach(([name, value]) => {
      const input = document.createElement("input");
      input.type  = "hidden";
      input.name  = name;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();

    // 2. cleanup Redux state when we unmount / re‑enter
    return () => dispatch(resetPaymentState());
  }, [formUrl, formData, dispatch]);

  /* --------------------------------------------- */
  /*  Click handler                                */
  /* --------------------------------------------- */
  const handleInitiateEsewaPayment = () => {
    if (!cartItems?.items?.length) {
      toast.info("Your cart is empty. Please add items to proceed.");
      return;
    }
    if (!currentSelectedAddress) {
      toast.info("Please select an address to proceed.");
      return;
    }

    const orderData = {
      userId: user?.id,
      cartId: cartItems._id,
      cartItems: cartItems.items.map((c) => ({
        productId: c.productId,
        title:     c.title,
        image:     c.image,
        price:     c.salePrice > 0 ? c.salePrice : c.price,
        quantity:  c.quantity,
      })),
      addressInfo: {
        addressId: currentSelectedAddress._id,
        address:   currentSelectedAddress.address,
        city:      currentSelectedAddress.city,
        pincode:   currentSelectedAddress.pincode,
        phone:     currentSelectedAddress.phone,
        notes:     currentSelectedAddress.notes,
      },
      orderStatus:    "pending",
      paymentMethod:  "esewa",
      paymentStatus:  "pending",
      totalAmount:    totalCartAmount,
      orderDate:      new Date(),
      orderUpdateDate:new Date(),
    };

    dispatch(createEsewaOrder(orderData)).unwrap()
      .catch(() => toast.error("Could not start eSewa payment. Please try again."));
  };

  /* --------------------------------------------- */
  /*  UI                                           */
  /* --------------------------------------------- */
  return (
    <div className="flex flex-col">
      {/* Hero image */}
      <div className="relative h-[300px] w-full overflow-hidden">
        <img
          src={userImg}
          className="h-full w-full object-cover object-center"
          alt="Checkout banner"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 mt-5">
        {/* Address selector */}
        <Address
          selectedId={currentSelectedAddress}
          setCurrentSelectedAddress={setCurrentSelectedAddress}
        />

        {/* Cart + pay */}
        <div className="flex flex-col gap-4">
          {cartItems?.items?.map((item) => (
            <UserCartItemsContent key={item.productId} cartItem={item} />
          ))}

          {/* Total */}
          <div className="mt-8 space-y-4">
            <div className="flex justify-between">
              <span className="font-bold">Total</span>
              <span className="font-bold">₹{totalCartAmount}</span>
            </div>
          </div>

          {/* Pay button */}
          <div className="mt-4 w-full">
            <Button
              onClick={handleInitiateEsewaPayment}
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Redirecting …" : "Checkout with eSewa"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShoppingCheckout;
