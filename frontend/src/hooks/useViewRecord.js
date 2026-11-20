import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

// Query parameter a notification link uses to name the record to open.
export const VIEW_PARAM = "view";

// Opens a page's drawer for ?view=<id> once the page loads.
// fetchRecord(id) resolves to the record, or null when it no longer exists
// or is outside the user's scope (nothing opens then). onOpen(record) opens
// the drawer. The parameter is then removed, so closing the drawer or
// refreshing does not reopen it. Pages whose onOpen rewrites the search
// params itself pass clearParam: false and drop VIEW_PARAM in that update
// (two updates in one tick would overwrite each other).
export function useViewRecord({ fetchRecord, onOpen, clearParam = true }) {
    const [searchParams, setSearchParams] = useSearchParams();
    const viewId = searchParams.get(VIEW_PARAM);

    const latest = useRef({ fetchRecord, onOpen, setSearchParams });
    useEffect(() => {
        latest.current = { fetchRecord, onOpen, setSearchParams };
    });

    useEffect(() => {
        if (!viewId) return undefined;
        let cancelled = false;
        let opened = false;

        Promise.resolve()
            .then(() => latest.current.fetchRecord(viewId))
            .then((record) => {
                if (cancelled || !record) return;
                latest.current.onOpen(record);
                opened = true;
            })
            .catch(() => {})
            .finally(() => {
                // onOpen already dropped the parameter when clearParam is false.
                if (cancelled || (opened && !clearParam)) return;
                latest.current.setSearchParams(
                    (params) => {
                        const next = new URLSearchParams(params);
                        next.delete(VIEW_PARAM);
                        return next;
                    },
                    { replace: true },
                );
            });

        return () => {
            cancelled = true;
        };
    }, [viewId, clearParam]);
}

// fetchRecord for list endpoints that accept an id filter: the first row of
// the given list key, e.g. firstListRow(getReports, "reports").
export const firstListRow = (fetchList, key, params = {}) => async (id) => {
    const data = await fetchList({ ...params, id, page: 1, limit: 1 });
    return data?.[key]?.[0] ?? null;
};
