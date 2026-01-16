export default function BottomNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t">
      <div className="max-w-sm mx-auto grid grid-cols-4 text-center py-2 text-xs">
        <div className="text-snoonu font-semibold">Home</div>
        <div className="text-gray-500">Browse</div>
        <div className="text-gray-500">Cart</div>
        <div className="text-gray-500">Account</div>
      </div>
    </div>
  );
}
