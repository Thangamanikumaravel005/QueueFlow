import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface QueueContextType {
  waitingQueue: number[];
  nowServing: number;
  customerToken: number | null;

  services: string[];

  addToken: () => number;
  callNext: () => void;
  clearCustomerToken: () => void;

  addService: (service: string) => void;
  removeService: (service: string) => void;
}

const QueueContext = createContext<QueueContextType | undefined>(
  undefined
);

export function QueueProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [waitingQueue, setWaitingQueue] =
    useState<number[]>([
      22,
      23,
      24,
      25,
      26,
    ]);

  const [nowServing, setNowServing] =
    useState(21);

  const [customerToken, setCustomerToken] =
    useState<number | null>(null);

  const [services, setServices] =
    useState<string[]>([
      "Cash Deposit",
      "Account Opening",
      "Loan Enquiry",
      "Customer Support",
    ]);

  const addToken = () => {
    const lastToken =
      waitingQueue.length > 0
        ? waitingQueue[waitingQueue.length - 1]
        : nowServing;

    const newToken = lastToken + 1;

    setWaitingQueue((currentQueue) => [
      ...currentQueue,
      newToken,
    ]);

    setCustomerToken(newToken);

    return newToken;
  };

  const callNext = () => {
    if (waitingQueue.length === 0) {
      return;
    }

    const nextToken = waitingQueue[0];

    setNowServing(nextToken);

    setWaitingQueue((currentQueue) =>
      currentQueue.slice(1)
    );
  };

  const clearCustomerToken = () => {
    setCustomerToken(null);
  };

  const addService = (service: string) => {
    const trimmedService = service.trim();

    if (!trimmedService) {
      return;
    }

    setServices((currentServices) => [
      ...currentServices,
      trimmedService,
    ]);
  };

  const removeService = (service: string) => {
    setServices((currentServices) =>
      currentServices.filter(
        (item) => item !== service
      )
    );
  };

  return (
    <QueueContext.Provider
      value={{
        waitingQueue,
        nowServing,
        customerToken,
        services,
        addToken,
        callNext,
        clearCustomerToken,
        addService,
        removeService,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
}

export function useQueue() {
  const context = useContext(QueueContext);

  if (!context) {
    throw new Error(
      "useQueue must be used inside QueueProvider"
    );
  }

  return context;
}