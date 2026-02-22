import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ProcurementMain() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/procurement/dashboard", { replace: true });
  }, [navigate]);

  return null;
}