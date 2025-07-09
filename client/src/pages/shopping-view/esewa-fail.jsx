import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { verifyEsewaPayment } from "@/store/shop/order-slice";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useSearchParams, useNavigate } from "react-router-dom";

function EsewaFail() {
  const dispatch = useDispatch();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  // eSewa sends these query params on success redirect
  const orderId = params.get("orderId");
  const total_amount = params.get("total_amount");
  const transaction_uuid = params.get("transaction_uuid");

  const [error, setError] = useState(null);

  useEffect(() => {
    if (orderId && total_amount && transaction_uuid) {
      dispatch(
        verifyEsewaPayment({ orderId, total_amount, transaction_uuid })
      )
        .unwrap()
        .then(() => {
          navigate("/shop/payment-success");
        })
        .catch(() => {
          setError("Payment verification failed. Please contact support.");
        });
    } else {
      setError("Missing payment parameters.");
    }
  }, [orderId, total_amount, transaction_uuid, dispatch, navigate]);

  return (
    <Card className="max-w-xl mx-auto mt-20 p-6">
      <CardHeader>
        <CardTitle>
          {error ? "Payment Failed" : "Processing Payment... Please wait!"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && <p className="text-red-600">{error}</p>}
      </CardContent>
    </Card>
  );
}

export default EsewaFail;
