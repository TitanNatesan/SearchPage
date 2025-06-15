import { X } from "lucide-react";

export default function SearchAction({ selectedAction, setSelectedAction, action }) {

    return (
        <button
            type="button"
            onClick={() => setSelectedAction(selectedAction === action ? "search" : action)}
            className="searchaction"
        >
            {selectedAction === action && <X className="inline h-full mr-2" />}
            {action}
        </button>
    );
}