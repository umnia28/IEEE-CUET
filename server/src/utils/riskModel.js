export const predictRiskWithModel = async ({
  latitude,
  longitude,
  district,
}) => {
  const response = await fetch(`${process.env.MODEL_API_URL}/predict-risk`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      latitude: Number(latitude),
      longitude: Number(longitude),
      district,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Risk model prediction failed");
  }

  return data;
};