"use client";

import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { HistoryFilters } from "./HistoryFilters";
import { RunHistoryDetail } from "./RunHistoryDetail";
import { RunHistoryList } from "./RunHistoryList";
import type { HistoryRunDetail, HistoryRunSummary } from "./types";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Spinner } from "@/components/ui/Spinner";

type HistoryListApiResponse = {
  data?: HistoryRunSummary[];
  error?: string;
};

type HistoryDetailApiResponse = {
  data?: HistoryRunDetail;
  error?: string;
};

export function HistoryPageClient() {
  const [runs, setRuns] = useState<HistoryRunSummary[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<HistoryRunDetail | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [listError, setListError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toolSourceFilter, setToolSourceFilter] = useState("all");
  const deferredSearchValue = useDeferredValue(searchValue);

  useEffect(() => {
    let cancelled = false;

    async function loadHistoryList() {
      try {
        const response = await fetch("/api/history");
        const payload = (await response.json()) as HistoryListApiResponse;

        if (!response.ok || !payload.data) {
          throw new Error(payload.error || "Unable to load your history.");
        }

        if (cancelled) {
          return;
        }

        setRuns(payload.data);
        setSelectedSessionId(payload.data[0]?.sessionId ?? null);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setListError(error instanceof Error ? error.message : "Unable to load your history.");
      } finally {
        if (!cancelled) {
          setIsLoadingList(false);
        }
      }
    }

    void loadHistoryList();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadHistoryDetail(sessionId: string) {
      setIsLoadingDetail(true);
      setDetailError("");

      try {
        const response = await fetch(`/api/history/${sessionId}`);
        const payload = (await response.json()) as HistoryDetailApiResponse;

        if (!response.ok || !payload.data) {
          throw new Error(payload.error || "Unable to load the selected history item.");
        }

        if (cancelled) {
          return;
        }

        setSelectedRun(payload.data);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setSelectedRun(null);
        setDetailError(
          error instanceof Error
            ? error.message
            : "Unable to load the selected history item."
        );
      } finally {
        if (!cancelled) {
          setIsLoadingDetail(false);
        }
      }
    }

    if (!selectedSessionId) {
      setSelectedRun(null);
      setIsLoadingDetail(false);
      setDetailError("");
      return () => {
        cancelled = true;
      };
    }

    void loadHistoryDetail(selectedSessionId);

    return () => {
      cancelled = true;
    };
  }, [selectedSessionId]);

  const filteredRuns = useMemo(() => {
    const normalizedSearch = deferredSearchValue.trim().toLowerCase();

    return runs.filter((run) => {
      const matchesStatus = statusFilter === "all" || run.status === statusFilter;
      const matchesToolSource =
        toolSourceFilter === "all" ||
        (toolSourceFilter === "runtime_mcp" && run.hasRuntimeMcpActivity) ||
        (toolSourceFilter === "built_in" && !run.hasRuntimeMcpActivity);
      const matchesSearch =
        !normalizedSearch ||
        run.title.toLowerCase().includes(normalizedSearch) ||
        run.userPrompt?.toLowerCase().includes(normalizedSearch) ||
        run.trace?.runId.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesToolSource && matchesSearch;
    });
  }, [deferredSearchValue, runs, statusFilter, toolSourceFilter]);

  useEffect(() => {
    if (!filteredRuns.length) {
      return;
    }

    if (filteredRuns.some((run) => run.sessionId === selectedSessionId)) {
      return;
    }

    setSelectedSessionId(filteredRuns[0]?.sessionId ?? null);
  }, [filteredRuns, selectedSessionId]);

  if (isLoadingList) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <Spinner label="Loading history" size="md" />
      </div>
    );
  }

  if (listError) {
    return <ErrorAlert message={listError} title="Unable to load history" />;
  }

  if (!runs.length) {
    return (
      <EmptyState
        description="Your saved sessions will appear here after you chat with the assistant and generate tool activity or LangSmith-linked runs."
        title="No run history yet"
      />
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <HistoryFilters
        onSearchChange={setSearchValue}
        onStatusChange={setStatusFilter}
        onToolSourceChange={setToolSourceFilter}
        runCount={runs.length}
        runtimeMcpCount={runs.filter((run) => run.hasRuntimeMcpActivity).length}
        searchValue={searchValue}
        selectedStatus={statusFilter}
        selectedToolSource={toolSourceFilter}
      />
      {filteredRuns.length ? (
        <>
          <RunHistoryList
            onSelect={(sessionId) => {
              startTransition(() => {
                setSelectedSessionId(sessionId);
              });
            }}
            runs={filteredRuns}
            selectedSessionId={selectedSessionId}
          />
          <RunHistoryDetail error={detailError} isLoading={isLoadingDetail} run={selectedRun} />
        </>
      ) : (
        <div className="xl:col-span-2">
          <EmptyState
            description="Try widening the filters or clearing the search query to bring matching sessions back into view."
            title="No sessions match these filters"
          />
        </div>
      )}
    </div>
  );
}
