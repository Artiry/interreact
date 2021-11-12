declare module 'react-interactable/noNative'
{
    import {FC} from "react";
    interface InteractableProps
    {
        horizontalOnly?: boolean
    }
    class Interactable
    {
        static View: FC<InteractableProps>
    }
    export default Interactable;
}