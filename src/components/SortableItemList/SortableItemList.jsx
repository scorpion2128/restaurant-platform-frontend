import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import './SortableItemList.css'

const SortableRow = ({ item, index, getItemId, getName, getPrice }) => {
  const id = getItemId(item)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const price = getPrice?.(item)

  return (
    <div
      ref={setNodeRef}
      className={`sortable-menu-item${isDragging ? ' is-dragging' : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      aria-label={`Mover ${getName(item)}, posición ${index + 1}`}
    >
      <span className="sortable-menu-order" aria-label={`Orden ${index + 1}`}>{index + 1}</span>
      <span className="sortable-menu-handle" aria-hidden="true">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 5h2v2H9V5Zm4 0h2v2h-2V5ZM9 11h2v2H9v-2Zm4 0h2v2h-2v-2ZM9 17h2v2H9v-2Zm4 0h2v2h-2v-2Z" />
        </svg>
      </span>
      <span className="sortable-menu-name">{getName(item)}</span>
      {Number.isFinite(Number(price)) && (
        <span className="sortable-menu-price">S/ {Number(price).toFixed(2)}</span>
      )}
    </div>
  )
}

const SortableItemList = ({
  items,
  onReorder,
  getItemId = item => item.id,
  getName = item => item.productName || item.name,
  getPrice = item => item.productPrice ?? item.basePrice ?? item.price
}) => {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex(item => getItemId(item) === active.id)
    const newIndex = items.findIndex(item => getItemId(item) === over.id)
    if (oldIndex >= 0 && newIndex >= 0) onReorder(arrayMove(items, oldIndex, newIndex))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map(getItemId)} strategy={verticalListSortingStrategy}>
        <div className="sortable-menu-list">
          {items.map((item, index) => (
            <SortableRow
              key={getItemId(item)}
              item={item}
              index={index}
              getItemId={getItemId}
              getName={getName}
              getPrice={getPrice}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

export default SortableItemList
