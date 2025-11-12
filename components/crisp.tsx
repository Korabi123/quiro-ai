"use client"

import { useEffect } from "react";
import { Crisp } from "crisp-sdk-web";

const CrispChat = () => {
  useEffect(() => {
    Crisp.configure("e40e6bd9-f19c-4ba0-89a7-4ae6642605a4");
  });

  return null;
}

export default CrispChat;
