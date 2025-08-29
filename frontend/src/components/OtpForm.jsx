import { useFormik } from "formik";
import * as Yup from "yup";
import { sendOtp } from "../services/authService";
import useApiFeedback from "../hooks/useApiFeedback"
import { useState } from "react";

function OtpForm(props) {
  const { handleSuccess, handleError } = useApiFeedback();
  const [loading, setLoading] = useState(false);
  const formik = useFormik({
    initialValues: {
      email: "",
      purpose: props?.purpose || "signup"
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email("Invalid Email Address")
        .required("Required"),
      purpose: Yup.string()
        .oneOf(["signup", "forgot-password"], "Invalid purpose")
        .required("Purpose Missing")
    }),
    onSubmit: async (values, {resetForm}) => {
      setLoading(true);
      try {
        const res = await sendOtp(values);
        handleSuccess(res);
        resetForm();
      } catch (err) {
        handleError(err)
      } finally {
        setLoading(false);
      }
    }
  })
  return (
    <form onSubmit={formik.handleSubmit}>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        value={formik.values.email}
      />
      {formik.touched.email && formik.errors.email ? (
        <div style={{color:"red"}}>{formik.errors.email}</div>
      ) : null }

      <input
        id="purpose"
        name="purpose"
        type="text"
        hidden={true}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        value={formik.values.purpose}
      />    

    <button type="submit" disabled={loading}>{loading ? "Sending..." : "Submit"}</button>
    </form>
  )
}

export default OtpForm;