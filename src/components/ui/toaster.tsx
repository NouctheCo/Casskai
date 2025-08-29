
import * as Toast from '@radix-ui/react-toast';
import { useToast } from './use-toast';

export function Toaster() {
  const { toasts } = useToast();

  return (
    <Toast.Provider>
      {toasts.map(({ id, title, description, ...props }) => (
        <Toast.Root key={id} className="ToastRoot">
          <div className="grid gap-1">
            {title && <Toast.Title className="ToastTitle">{title}</Toast.Title>}
            {description && (
              <Toast.Description className="ToastDescription">
                {description}
              </Toast.Description>
            )}
          </div>
        </Toast.Root>
      ))}
      <Toast.Viewport className="ToastViewport" />
    </Toast.Provider>
  );
}
