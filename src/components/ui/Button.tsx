import type { ButtonHTMLAttributes } from 'react'
import styles from './Button.module.css'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'lg' | 'md' | 'sm'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary：深色（開始整理）；secondary：淺底加框（返回）；ghost：無底（分類設定） */
  variant?: Variant
  /** lg 高 42、md 高 36、sm 高 29（工具列） */
  size?: Size
}

export function Button({
  variant = 'secondary',
  size = 'lg',
  type = 'button',
  className,
  ...rest
}: Props) {
  const cls = [styles.button, styles[variant], styles[size], className].filter(Boolean).join(' ')
  return <button type={type} className={cls} {...rest} />
}
