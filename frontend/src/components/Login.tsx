import { LOGIN_URL } from "../api";

export default function Login() {
  return (
    <div className="login-screen">
      <h1> Salesforce Cloud CRUD WebApp</h1>
      <p>Log in with your Salesforce account to manage your records.</p>
      <button
        className="btn-primary"
        onClick={() => {
          window.location.href = LOGIN_URL;
        }}
      >
        Login with Salesforce
      </button>
    </div>
  );
}