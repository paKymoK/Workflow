import { useContext } from "react";
import { FontContext } from "./FontContext";

export const useFont = () => useContext(FontContext);
