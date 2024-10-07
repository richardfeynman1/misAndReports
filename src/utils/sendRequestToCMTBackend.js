import axios from "axios";

export async function sendRequestToCMTBackend(method, route, token, data) {
  const config = {
    method: method,
    maxBodyLength: Infinity,
    url: route,
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${token}`,
    },
    data: data,
  };

  // console.log(config, "configigigigiggigigig");
  try {
    const response = await axios.request(config);
    return { statusCode: 200, data: response.data };
  } catch (err) {
    return { statusCode: 500, data: err.response };
  }
}
