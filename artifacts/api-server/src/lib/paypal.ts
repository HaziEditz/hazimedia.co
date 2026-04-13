const PAYPAL_BASE =
  process.env.PAYPAL_ENV === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

export const PACKAGE_PRICES: Record<string, { amount: string; label: string }> = {
  starter: { amount: "19.00", label: "Starter Promotion" },
  growth: { amount: "29.00", label: "Growth Promotion" },
  premium: { amount: "49.00", label: "Premium Promotion" },
};

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !secret) {
    throw new Error("PayPal credentials are not configured");
  }

  const credentials = Buffer.from(`${clientId}:${secret}`).toString("base64");

  const response = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`PayPal auth failed: ${err}`);
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

export async function createPayPalOrder(
  packageType: string
): Promise<{ id: string; amount: string }> {
  const pkg = PACKAGE_PRICES[packageType];
  if (!pkg) throw new Error(`Unknown package type: ${packageType}`);

  const token = await getAccessToken();

  const response = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: pkg.amount,
          },
          description: `Hazi Media — ${pkg.label}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`PayPal create order failed: ${err}`);
  }

  const data = (await response.json()) as { id: string };
  return { id: data.id, amount: pkg.amount };
}

export async function capturePayPalOrder(orderId: string): Promise<boolean> {
  const token = await getAccessToken();

  const response = await fetch(
    `${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`PayPal capture failed: ${err}`);
  }

  const data = (await response.json()) as { status: string };
  return data.status === "COMPLETED";
}
