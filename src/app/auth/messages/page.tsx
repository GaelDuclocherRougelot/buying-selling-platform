import { Metadata } from "next";
import MessagesPage from "./_components/MessagesPage";

export const metadata: Metadata = {
  title: "Messages",
  description: "Gérez vos conversations avec les acheteurs et vendeurs",
};

export default function MessagesPageRoute() {
  return <MessagesPage />;
}
