export function getErrorMessage(error, fallback = "Something went wrong") {
  const errors = error.response?.data?.errors;

  if (errors?.length > 0) {
    return errors[0].message;
  }

  return error.response?.data?.message || fallback;
}
