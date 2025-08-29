import axiosInstance from "../api/axiosInstance";

async function loginWithGoogle(idToken) {
  const res = await axiosInstance.post('/api/user/google-auth', { idToken });
  return res.data;
}

async function sendOtp({email, purpose}) {
  const res = await axiosInstance.post('/api/user/request-otp', { email, purpose });
  return res.data;
}

async function verifyOtp({email, otp, purpose}) {
  const res = await axiosInstance.post('/api/user/verify-otp', { email, otp, purpose });
  return res.data;
}

async function loginWithEmailAndPassword(email, password) {
  const res = await axiosInstance.post('/api/user/login', { email, password });
  return res.data;
}

export { loginWithGoogle, sendOtp, verifyOtp, loginWithEmailAndPassword };