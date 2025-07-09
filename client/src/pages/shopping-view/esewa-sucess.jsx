import React from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

function EsewaSuccess() {
  const navigate = useNavigate();

  return (
    <Card className="p-8 max-w-md mx-auto mt-20 text-center">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-3xl font-bold text-green-600">
          Payment Successful!
        </CardTitle>
      </CardHeader>
      <p className="mb-6">Your payment was processed successfully via eSewa.</p>
      <Button className="mt-6" onClick={() => navigate("/shop/account")}>
        View Your Orders
      </Button>
    </Card>
  );
}

export default EsewaSuccess;
